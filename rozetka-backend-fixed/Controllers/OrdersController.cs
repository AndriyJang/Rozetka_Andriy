using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using rozetkabackend.Constants;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Entities.Identity;
using rozetkabackend.Models.Order;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace rozetkabackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<UserEntity> _userManager;
        private readonly IMapper _mapper;

        public OrdersController(AppDbContext context,
            UserManager<UserEntity> userManager,
            IMapper mapper)
        {
            //Thread.Sleep(2000);
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
        }

        [HttpGet]
        [Route("status/list")]
        public async Task<IActionResult> StatusList()
        {
            try
            {
                //Thread.Sleep(2000);
                var model = await _context.OrderStatuses
                    .Select(x => _mapper.Map<OrderStatusItemViewModel>(x))
                    .ToListAsync();
                return Ok(model);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    invalid = ex.Message
                });
            }
        }

        [HttpPost]
        [Route("add")]
        public async Task<IActionResult> Add([FromBody] OrderAddViewModel model)
        {
            try
            {
                string userName = User.Claims.FirstOrDefault().Value;
                var user = await _userManager.FindByEmailAsync(userName);

                var entity = _mapper.Map<OrderEntity>(model);
                entity.UserId = user.Id;
                _context.Orders.Add(entity);
                _context.SaveChanges();

                var entityItems = model.OrderItems.Select(x => _mapper.Map<OrderItemEntity>(x));
                foreach (var item in entityItems)
                {
                    item.OrderId = entity.Id;
                    _context.OrderItems.Add(item);
                }
                _context.SaveChanges();

                var cartData = _context.Carts.Where(x => x.UserId == user.Id).ToArray();
                _context.Carts.RemoveRange(cartData);
                _context.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    invalid = ex.Message
                });
            }
        }

        [HttpGet]
        [Route("list")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> List()
        {
            try
            {
                //Thread.Sleep(2000);
                var model = await _context.Orders
                    .Include(x => x.OrderItems).ThenInclude(x => x.Product).ThenInclude(x => x.ProductImages)
                    .Include(x => x.OrderStatus)
                    .OrderByDescending(x => x.DateCreated)
                    .Select(x => _mapper.Map<OrderViewModel>(x))
                    .ToListAsync();
                return Ok(model);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    invalid = ex.Message
                });
            }
        }

        [HttpPost]
        [Route("status/change")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> ChangeStatus([FromBody] OrderChangeStatusViewModel model)
        {
            try
            {
                //Thread.Sleep(2000);
                var order = await _context.Orders.SingleOrDefaultAsync(x => x.Id == model.Id);
                order.OrderStatusId = model.StatusId;
                _context.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    invalid = ex.Message
                });
            }
        }

        [HttpGet]
        [Route("user/list")]
        public async Task<IActionResult> UserList()
        {
            try
            {
                string userName = User.Claims.FirstOrDefault().Value;
                var user = await _userManager.FindByEmailAsync(userName);
                //Thread.Sleep(2000);
                var model = await _context.Orders
                    .Include(x => x.OrderItems).ThenInclude(x => x.Product).ThenInclude(x => x.ProductImages)
                    .Include(x => x.OrderStatus)
                    .Where(x => x.UserId == user.Id)
                    .OrderByDescending(x => x.DateCreated)
                    .Select(x => _mapper.Map<OrderViewModel>(x))
                    .ToListAsync();
                return Ok(model);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    invalid = ex.Message
                });
            }
        }
    }
}
